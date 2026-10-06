export type { DocumentPart, ParsedDocument, ParsedSection } from './types/document-part';
export type { ParseOptions, PersonalNames } from './types/parser';
export { parseDocument } from './helpers/document-parser';
export { GoogleDocsModule } from './google-docs.module';
export { GoogleDocsService } from './google-docs.service';
export { collectPersonalNames, stripPersonalData } from './helpers/strip-personal-data';
