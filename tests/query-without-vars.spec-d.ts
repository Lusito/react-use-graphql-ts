import { expectType } from "tsd";

import { buildGraphQL } from "../dist";
import { ErrorDTO, UserDTO } from "./types";

const builders = buildGraphQL<UserDTO, ErrorDTO>();

/// Variables not allowed
// @ts-expect-error
builders.query("user", { id: true }, { id: "String!" });
// @ts-expect-error
builders.mutation("user", { id: true }, { id: "String!" });

/// Objects are not allowed to be selected via true
// @ts-expect-error
builders.query("user", { posts: true });
// @ts-expect-error
builders.mutation("user", { posts: true });

/// Attributes are not allowed to be selected via object
// @ts-expect-error
builders.query("user", { id: {} });
// @ts-expect-error
builders.mutation("user", { id: {} });

/// Allowed calls:
builders.query("user", { id: true });
builders.query("user", { id: true, posts: { hits: true } });
builders.mutation("user", { id: true });
builders.mutation("user", { id: true, posts: { hits: true } });

expectType<{
    name: string;
    query: string;
    _data?: { id: string; posts: Array<{ hits: number }> };
    _vars?: null;
    _error?: ErrorDTO;
}>(builders.query("user", { id: true, posts: { hits: true } }));
