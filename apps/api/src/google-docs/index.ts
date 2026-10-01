export type { DocumentPart, ParsedDocument, ParsedSection } from './types/document-part';
export { parseDocument, type ParseOptions } from './helpers/document-parser';
export { GoogleDocsModule } from './google-docs.module';
export { GoogleDocsService } from './google-docs.service';
export {
  collectPersonalNames,
  stripPersonalData,
  type PersonalNames,
} from './helpers/strip-personal-data';
