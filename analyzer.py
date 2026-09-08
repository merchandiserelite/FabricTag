import json
import logging
import re
from google import genai
from google.genai import types

logger = logging.getLogger("analyzer")

PROMPT = """
You are an expert fabric card label parser.
Analyze the image of the fabric swatch card and extract the following information. Return it as a JSON object.
Do NOT guess or hallucinate. If a field is not present, use an empty string.
Convert ALL extracted text to UPPERCASE.
CRITICAL: Ensure the output is strictly VALID JSON format with double quotes and proper comma separators between fields.

Keys to extract:
- company_name: Name of the textile company (e.g. BEZTAŞ, BÜNYEM, ÖZÇİMEN). Look for logos, text on hangers, or addresses at the bottom.
- quality_code: The fabric quality code or article number (look for "Article", "ART", "Art.", or codes like "K2072", "J-6039", "31740").
- quality_name: The fabric quality name (e.g. "SPINOZA RECYCLE"). Often near the quality code.
- design_code: The design or pattern code (look for "Design", "Design:", or codes like "ZN-1583", "BN 8750", "65585", "66461-D").
- width: The fabric width (look for "Width", "Width:", "En", or text containing "cm" or "cms" like "150 CM ±3", "165 CMS", "135 CM (±5)"). Keep the units.
- weight: The fabric weight / gramaj (look for "Weight", "Weight:", "Gramaj", or text containing "gr/m2" or "g/m2" or "GRM2" like "225 GRM2 (±5%)", "83 GR/M² ±5"). Keep the units.
- composition: The fabric composition/karışım. IMPORTANT: Remove ALL punctuation symbols like slashes (/), commas (,), dashes (-), and semicolons (;). Separate percentages and fibers ONLY with spaces (e.g., "%42 VIS %30 CO %25 PL %3 MTL" or "42% VIS 30% CO 25% PL 3% MTL").
- color: The color name, color code, or shade (look for "Color", "Colour", "Renk", "Col.", "Shade", e.g. "NAVY", "04 VARYANT", "BEYAZ", "12 SIYAH", "KHAKI").
- barcode_or_qr: Any barcode or QR code number printed near/under it (e.g. "02004197", "000000508522", "31740 65585-5030/1").

Return ONLY a JSON object matching this schema.
"""

def clean_composition(comp_str: str) -> str:
    if not comp_str:
        return ""
    cleaned = re.sub(r'[/,;+]+', ' ', str(comp_str))
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned.upper()

def extract_fields_fallback(raw_text: str) -> dict:
    """Regex fallback parser when AI JSON has missing commas or formatting errors."""
    data = {}
    expected_keys = [
        "company_name", "quality_code", "quality_name", 
        "design_code", "color", "width", "weight", "composition", "barcode_or_qr"
    ]
    for key in expected_keys:
        # Match "key": "value"
        pattern = rf'"{key}"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"'
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            data[key] = match.group(1)
        else:
            # Match "key": unquoted_value
            pattern_noquote = rf'"{key}"\s*:\s*([^,\}}\n]+)'
            match_noquote = re.search(pattern_noquote, raw_text, re.IGNORECASE)
            data[key] = match_noquote.group(1).strip('"\' ') if match_noquote else ""
    return data

def parse_json_robustly(text: str) -> dict:
    """Robustly parses JSON even if the LLM output is missing commas or has extra text."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # 1. Try standard json.loads
    try:
        return json.loads(text)
    except json.JSONDecodeError as err:
        logger.warning(f"Standard JSON decode failed ({str(err)}). Attempting regex fix...")

    # 2. Try fixing missing commas between key-value lines
    try:
        fixed_text = re.sub(r'("\s*)\n(\s*"[a-zA-Z_]+"\s*:)', r'\1,\n\2', text)
        fixed_text = re.sub(r',\s*}', '}', fixed_text)
        return json.loads(fixed_text)
    except json.JSONDecodeError:
        logger.warning("Regex JSON fix failed. Using fallback regex field extractor...")

    # 3. Fallback to direct key extraction
    return extract_fields_fallback(text)

def optimize_image_for_ocr(image_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """Optimizes image size and resolution for instant OCR transfer."""
    try:
        import io
        from PIL import Image
        im = Image.open(io.BytesIO(image_bytes))
        im = im.convert('RGB')
        max_dim = 1600
        if max(im.size) > max_dim:
            im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format='JPEG', quality=85, optimize=True)
        return buf.getvalue(), 'image/jpeg'
    except Exception as err:
        logger.warning(f"Image optimization skipped: {err}")
        return image_bytes, mime_type

def analyze_swatch_card(image_bytes: bytes, mime_type: str, api_key: str) -> dict:
    """
    Sends the fabric card image to Gemini API for OCR and structured extraction.
    Returns a dict with the extracted fields.
    """
    if not api_key:
        raise ValueError("Gemini API key is required. Please set it in Settings.")
        
    try:
        # Pre-compress image so upload completes in milliseconds
        optimized_bytes, optimized_mime = optimize_image_for_ocr(image_bytes, mime_type)
        
        client = genai.Client(api_key=api_key)
        
        # High speed and active Google Gemini models
        models_to_try = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']
        response = None
        last_error = None
        
        for model_name in models_to_try:
            try:
                logger.info(f"Analyzing with model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=optimized_bytes, mime_type=optimized_mime),
                        PROMPT
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    logger.info(f"Successfully analyzed using {model_name}")
                    break
            except Exception as e:
                logger.warning(f"Model {model_name} failed or unavailable: {str(e)}")
                last_error = e
                continue
                
        if not response or not response.text:
            if last_error:
                raise last_error
            else:
                raise Exception("Tüm yapay zeka modelleri meşgul veya hata verdi. Lütfen az sonra tekrar deneyin.")
        
        # Robustly parse JSON response
        data = parse_json_robustly(response.text)
        
        # Clean and uppercase all string values
        expected_keys = [
            "company_name", "quality_code", "quality_name", 
            "design_code", "width", "weight", "composition", "barcode_or_qr"
        ]
        for key in expected_keys:
            val = data.get(key, "")
            if isinstance(val, str):
                val = val.strip().upper()
                if key == "composition":
                    val = clean_composition(val)
                data[key] = val
            else:
                data[key] = ""
                
        return data
        
    except Exception as e:
        logger.error(f"Error in Gemini API analysis: {str(e)}")
        raise e
