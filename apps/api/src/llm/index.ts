export type {
  CatalogTopic,
  Extraction,
  ExtractedItem,
  ExtractedKanji,
  ImageText,
  ItemAssignment,
  ItemToAssign,
  LabelWithExamples,
  LlmPart,
  LlmProvider,
  ProposedTopic,
  Taxonomy,
  TopicAssignment,
} from './types/llm-provider';
export { LLM_PROVIDER } from './types/llm-provider';
export { LlmQuotaExhaustedError, LlmValidationError } from './llm.errors';
export { LlmModule } from './llm.module';
export { GeminiProvider } from './providers/gemini.provider';
// La ingesta revalida la taxonomía que el autor editó a mano con las mismas
// reglas que la respuesta del LLM.
export { checkTopicTree } from './schemas/common';
export { checkTaxonomy, taxonomySchema } from './schemas/taxonomy.schema';
export { checkExtraction, extractionSchema } from './schemas/extraction.schema';
// El proveedor manual del bootstrap arma las mismas solicitudes que Gemini y
// valida las respuestas igual.
export { parseStructured } from './helpers/structured-output';
export { EXTRACTION_INSTRUCTIONS, imageMarker } from './prompts/extraction.prompt';
export { TAXONOMY_INSTRUCTIONS, taxonomyUserMessage } from './prompts/taxonomy.prompt';
