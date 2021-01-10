import { buildGraphQL } from "../dist";
import { ErrorDTO, QueryUserVariables } from "./types";

const builders = buildGraphQL<number, ErrorDTO>();

/// Fields may not be specified
// @ts-expect-error
builders.query("time", {});
// @ts-expect-error
builders.mutation("time", {});

/// Variables may not be specified
// @ts-expect-error
builders.query("time", null, {});
// @ts-expect-error
builders.mutation("time", null, {});

/// Allowed calls:
builders.query("time", null);
builders.mutation("time", null);

const buildersWithVars = buildGraphQL<number, ErrorDTO, QueryUserVariables>();

/// Fields may not be specified
// @ts-expect-error
buildersWithVars.query("time", {}, { id: "String!" });
// @ts-expect-error
buildersWithVars.mutation("time", {}, { id: "String!" });

/// Variables may not be left out
// @ts-expect-error
buildersWithVars.query("time", null);
// @ts-expect-error
buildersWithVars.mutation("time", null);

/// Allowed calls:
buildersWithVars.query("time", null, { id: "String!" });
buildersWithVars.mutation("time", null, { id: "String!" });
