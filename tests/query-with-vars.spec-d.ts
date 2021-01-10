import { expectType } from "tsd";

import { buildGraphQL } from "../dist";
import { ErrorDTO, QueryUserVariables, UserDTO } from "./types";

const builders = buildGraphQL<UserDTO, ErrorDTO, QueryUserVariables>();

/// Missing variables not allowed
// @ts-expect-error
builders.query("user", { id: true });
// @ts-expect-error
builders.mutation("user", { id: true });

/// Wrong variable not allowed
// @ts-expect-error
builders.query("user", { id: true }, { foo: "String!" });
// @ts-expect-error
builders.mutation("user", { id: true }, { foo: "String!" });

/// Additional variables not allowed
// @ts-expect-error
builders.query("user", { id: true }, { id: "String!", foo: "String!" });
// @ts-expect-error
builders.mutation("user", { id: true }, { id: "String!", foo: "String!" });

/// Objects are not allowed to be selected via true
// @ts-expect-error
builders.query("user", { posts: true }, { id: "String!" });
// @ts-expect-error
builders.mutation("user", { posts: true }, { id: "String!" });

/// Attributes are not allowed to be selected via object
// @ts-expect-error
builders.query("user", { id: {} }, { id: "String!" });
// @ts-expect-error
builders.mutation("user", { id: {} }, { id: "String!" });

/// Allowed calls:
builders.query("user", { id: true }, { id: "String!" });
builders.query("user", { id: true, posts: { hits: true } }, { id: "String!" });
builders.mutation("user", { id: true }, { id: "String!" });
builders.mutation("user", { id: true, posts: { hits: true } }, { id: "String!" });

expectType<{
    name: string;
    query: string;
    _data?: { id: string; posts: Array<{ hits: number }> };
    _vars?: QueryUserVariables;
    _error?: ErrorDTO;
}>(builders.query("user", { id: true, posts: { hits: true } }, { id: "String!" }));
