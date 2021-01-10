/* eslint-disable @typescript-eslint/ban-types */
function toVariableDef(variableTypes?: Record<string, string>) {
    if (!variableTypes) return "";
    const keys = Object.keys(variableTypes);
    if (keys.length === 0) return "";
    const parts = keys.map((key) => `$${key}: ${variableTypes[key]}`);
    return `(${parts.join(", ")})`;
}

function toVariablePass(variableTypes?: Record<string, string>) {
    if (!variableTypes) return "";
    const keys = Object.keys(variableTypes);
    if (keys.length === 0) return "";
    const parts = keys.map((key) => `${key}: $${key}`);
    return `(${parts.join(", ")})`;
}

type AttribMap = { [s: string]: undefined | boolean | AttribMap };

function toFieldsDef(flags?: null | AttribMap): string {
    if (!flags) return "";
    const keys = Object.keys(flags);
    if (keys.length === 0) return "";
    const result = ["{"];
    for (const key of keys) {
        const val = flags[key];
        if (val) {
            result.push(key);
            if (val !== true) {
                result.push(toFieldsDef(val));
            }
        }
    }
    result.push("}");
    return result.join(" ");
}

export type JsonPrimitive = null | string | number | boolean;
export type ResultType = JsonPrimitive | Record<string, any>;
export type VariableType = null | Record<string, any>;

export type ChoicesDeep2<T> = T extends JsonPrimitive
    ? Partial<boolean>
    : T extends Array<infer T2>
    ? ChoicesDeep2<T2>
    : ChoicesDeep<T>;

export type ChoicesDeep<T extends Record<string, any>> = {
    [KeyType in keyof T]?: ChoicesDeep2<T[KeyType]>;
};

export type KeepField<TOpt> = TOpt extends object ? 1 : TOpt extends true ? 1 : 0;
export type TypeForChoice<T, TOpt> = T extends JsonPrimitive
    ? T
    : T extends Array<infer T2>
    ? Array<TypeForChoice<T2, TOpt>>
    : ChoicesToResult<T, TOpt>;
export type ChoicesToResult<T extends Record<string, any>, TOpt extends ChoicesDeep<T>> = {
    [P in keyof T as KeepField<TOpt[P]> extends 1 ? P : never]: TypeForChoice<T[P], TOpt[P]>;
};

export interface GraphQLQuery<TResultData, TVars, TError> {
    name: string;
    query: string;
    // These are only here to carry the type and will not be set!:
    _data?: TResultData;
    _vars?: TVars;
    _error?: TError;
}

export type GraphQLResultOf<T> = T extends GraphQLQuery<infer TResultData, any, any> ? TResultData : never;

export type FieldChoicesFor<T extends ResultType> = T extends JsonPrimitive
    ? never
    : T extends Array<infer T2>
    ? FieldChoicesFor<T2>
    : T extends Record<string, any>
    ? ChoicesDeep<T>
    : never;

export type ReducedResult<T extends ResultType, TFieldChoices> = T extends JsonPrimitive
    ? T
    : T extends Array<infer T2>
    ? Array<ReducedResult<T2, TFieldChoices>>
    : T extends Record<string, any>
    ? ChoicesToResult<T, TFieldChoices>
    : never;

export type BuilderFor<TFullResult extends ResultType, TError, TVars extends VariableType> = TVars extends null
    ? <TFieldChoices extends null | FieldChoicesFor<TFullResult>>(
          name: string,
          fields: TFieldChoices
      ) => GraphQLQuery<ReducedResult<TFullResult, TFieldChoices>, null, TError>
    : <TFieldChoices extends null | FieldChoicesFor<TFullResult>>(
          name: string,
          fields: TFieldChoices,
          variableTypes: TVars extends null ? never : { [P in keyof TVars]: string }
      ) => GraphQLQuery<ReducedResult<TFullResult, TFieldChoices>, TVars, TError>;

export type BuildersFor<TFullResult extends ResultType, TError, TVars extends VariableType> = {
    query: BuilderFor<TFullResult, TError, TVars>;
    mutation: BuilderFor<TFullResult, TError, TVars>;
};

function build(
    type: "query" | "mutation",
    name: string,
    fields?: null | AttribMap,
    variableTypes?: Record<string, string>
): GraphQLQuery<any, any, any> {
    const varsDef = toVariableDef(variableTypes);
    const varsPass = toVariablePass(variableTypes);
    const fieldsDef = toFieldsDef(fields);
    return {
        query: `${type}${varsDef} { ${name}${varsPass} ${fieldsDef} }`,
        name,
    };
}

const builders: { [s: string]: BuilderFor<any, any, any> } = {
    query: (name, fields, variableTypes) => build("query", name, fields, variableTypes),
    mutation: (name, fields, variableTypes) => build("mutation", name, fields, variableTypes),
};

export function buildGraphQL<TFullResult extends ResultType, TError>(): BuildersFor<TFullResult, TError, null>;
export function buildGraphQL<TFullResult extends ResultType, TError, TVars extends Record<string, any>>(): BuildersFor<
    TFullResult,
    TError,
    TVars
>;
export function buildGraphQL<TFullResult extends ResultType, TError, TVars extends VariableType>() {
    return builders as BuildersFor<TFullResult, TError, TVars>;
}

export type GraphGLVariableTypes<T extends Record<string, any>> = {
    [P in keyof T]: string;
};
