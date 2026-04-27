export type NotionFilter = Record<string, unknown>;
export type NotionSort = Record<string, unknown>;
export type NotionDatabasePropertyType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "people"
  | "files"
  | "checkbox"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by";

export interface NotionRichText {
  plain_text: string;
}

export interface NotionUser {
  object: "user";
  id: string;
  name?: string;
}

export interface NotionParentReference {
  type: string;
  database_id?: string;
}

export interface NotionTitlePropertyValue {
  id: string;
  type: "title";
  title: NotionRichText[];
}

export interface NotionRichTextPropertyValue {
  id: string;
  type: "rich_text";
  rich_text: NotionRichText[];
}

export interface NotionNumberPropertyValue {
  id: string;
  type: "number";
  number: number | null;
}

export interface NotionCheckboxPropertyValue {
  id: string;
  type: "checkbox";
  checkbox: boolean;
}

export interface NotionUrlPropertyValue {
  id: string;
  type: "url";
  url: string | null;
}

export interface NotionEmailPropertyValue {
  id: string;
  type: "email";
  email: string | null;
}

export interface NotionSelectOption {
  id?: string;
  name: string;
  color?: string;
}

export interface NotionDatabasePropertySchema {
  id: string;
  name?: string;
  type: NotionDatabasePropertyType;
  title?: Record<string, unknown>;
  rich_text?: Record<string, unknown>;
  number?: Record<string, unknown>;
  select?: {
    options?: NotionSelectOption[];
  };
  multi_select?: {
    options?: NotionSelectOption[];
  };
  status?: {
    options?: NotionSelectOption[];
    groups?: Array<Record<string, unknown>>;
  };
  date?: Record<string, unknown>;
  people?: Record<string, unknown>;
  files?: Record<string, unknown>;
  checkbox?: Record<string, unknown>;
  url?: Record<string, unknown>;
  email?: Record<string, unknown>;
  phone_number?: Record<string, unknown>;
  formula?: Record<string, unknown>;
  relation?: Record<string, unknown>;
  rollup?: Record<string, unknown>;
  created_time?: Record<string, unknown>;
  created_by?: Record<string, unknown>;
  last_edited_time?: Record<string, unknown>;
  last_edited_by?: Record<string, unknown>;
}

export type NotionDatabaseProperties = Record<string, NotionDatabasePropertySchema>;
export type NotionDatabasePropertyWriteSchema = Record<string, unknown>;
export type NotionDatabasePropertyWriteSchemas = Record<string, NotionDatabasePropertyWriteSchema>;

export interface NotionDatabase {
  object: "database";
  id: string;
  title: NotionRichText[];
  properties: NotionDatabaseProperties;
}

export interface NotionDatabaseUpdateRequest {
  properties?: NotionDatabasePropertyWriteSchemas;
}

export interface NotionSelectPropertyValue {
  id: string;
  type: "select";
  select: NotionSelectOption | null;
}

export interface NotionStatusPropertyValue {
  id: string;
  type: "status";
  status: NotionSelectOption | null;
}

export interface NotionMultiSelectPropertyValue {
  id: string;
  type: "multi_select";
  multi_select: NotionSelectOption[];
}

export interface NotionDateValue {
  start: string;
  end: string | null;
  time_zone: string | null;
}

export interface NotionDatePropertyValue {
  id: string;
  type: "date";
  date: NotionDateValue | null;
}

export interface NotionPeoplePropertyValue {
  id: string;
  type: "people";
  people: NotionUser[];
}

export interface NotionRelationValue {
  id: string;
}

export interface NotionRelationPropertyValue {
  id: string;
  type: "relation";
  relation: NotionRelationValue[];
  has_more?: boolean;
}

export interface NotionFormulaStringValue {
  type: "string";
  string: string | null;
}

export interface NotionFormulaNumberValue {
  type: "number";
  number: number | null;
}

export interface NotionFormulaBooleanValue {
  type: "boolean";
  boolean: boolean | null;
}

export interface NotionFormulaDateValue {
  type: "date";
  date: NotionDateValue | null;
}

export type NotionFormulaValue =
  | NotionFormulaStringValue
  | NotionFormulaNumberValue
  | NotionFormulaBooleanValue
  | NotionFormulaDateValue;

export interface NotionFormulaPropertyValue {
  id: string;
  type: "formula";
  formula: NotionFormulaValue;
}

export interface NotionCreatedTimePropertyValue {
  id: string;
  type: "created_time";
  created_time: string;
}

export interface NotionLastEditedTimePropertyValue {
  id: string;
  type: "last_edited_time";
  last_edited_time: string;
}

export type NotionPagePropertyValue =
  | NotionTitlePropertyValue
  | NotionRichTextPropertyValue
  | NotionNumberPropertyValue
  | NotionCheckboxPropertyValue
  | NotionUrlPropertyValue
  | NotionEmailPropertyValue
  | NotionSelectPropertyValue
  | NotionMultiSelectPropertyValue
  | NotionStatusPropertyValue
  | NotionDatePropertyValue
  | NotionPeoplePropertyValue
  | NotionRelationPropertyValue
  | NotionFormulaPropertyValue
  | NotionCreatedTimePropertyValue
  | NotionLastEditedTimePropertyValue;

export type NotionPageProperties = Record<string, NotionPagePropertyValue>;
export type NotionPropertyWriteValue = Record<string, unknown>;
export type NotionPageWriteProperties = Record<string, NotionPropertyWriteValue>;

export interface NotionPage {
  object: "page";
  id: string;
  url: string;
  archived: boolean;
  created_time: string;
  last_edited_time: string;
  parent: NotionParentReference;
  properties: NotionPageProperties;
}

export interface NotionDatabaseQueryResponse {
  object: "list";
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface NotionPageCreateRequest {
  parent: {
    database_id: string;
  };
  properties: NotionPageWriteProperties;
}

export interface NotionPageUpdateRequest {
  properties?: NotionPageWriteProperties;
  archived?: boolean;
}

export interface NotionDatabaseQueryRequest {
  filter?: NotionFilter;
  sorts?: NotionSort[];
  start_cursor?: string;
  page_size?: number;
}

export interface NotionErrorBody {
  object: "error";
  status: number;
  code: string;
  message: string;
}
