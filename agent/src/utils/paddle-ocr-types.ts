/** Result shape returned by runPaddleOCR — mirrors what the old groq-ocr returned. */
export interface IdOcrResult {
  id_number: string
  first_name: string
  middle_name: string
  last_name: string
  /** MM/DD/YYYY */
  date_of_birth: string
  /** PH_ID_TYPES code, e.g. "PAS", "DRI", "SSS" … */
  id_type: string
  /** Raw concatenated text, useful for debugging */
  raw_text: string
}
