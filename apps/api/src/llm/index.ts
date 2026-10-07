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
} from './types/llm-provider.js';
export { LLM_PROVIDER } from './types/llm-provider.js';
export { LlmQuotaExhaustedError, LlmValidationError } from './llm.errors.js';
export { LlmModule } from './llm.module.js';
export { GeminiProvider } from './providers/gemini.provider.js';
// La ingesta revalida la taxonomía que el autor editó a mano con las mismas
// reglas que la respuesta del LLM.
export { checkTopicTree } from './schemas/common.js';
export { checkTaxonomy, taxonomySchema } from './schemas/taxonomy.schema.js';
export { checkExtraction, extractionSchema } from './schemas/extraction.schema.js';
// El proveedor manual del bootstrap arma las mismas solicitudes que Gemini y
// valida las respuestas igual.
export { parseStructured } from './helpers/structured-output.js';
export { EXTRACTION_INSTRUCTIONS, imageMarker } from './prompts/extraction.prompt.js';
export { TAXONOMY_INSTRUCTIONS, taxonomyUserMessage } from './prompts/taxonomy.prompt.js';
