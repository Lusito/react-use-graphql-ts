import { expectType } from "tsd";

import { GraphGLVariableTypes } from "../dist";
import { PostDTO, QueryUserVariables } from "./types";

expectType<{
    id: string;
}>((0 as any) as GraphGLVariableTypes<QueryUserVariables>);

// Only top-level attributes need to be specified:
expectType<{
    id: string;
    title: string;
    message: string;
    hits: string;
    user: string;
}>((0 as any) as GraphGLVariableTypes<PostDTO>);
