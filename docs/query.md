# Query Definition

## buildGraphQL

`buildGraphQL` helps you to define queries and mutations, which can then be used in the [useGraphQL hook](hook.md).

It takes 2-3 type arguments:
- The full type that could be returned by the server if all fields had been selected
- The error type that would be returned in case of an error (the non-array form).
- The (optional) variables type that the server expects for the query/mutation.

It returns an object with 2 builders: `query` and `mutation`, which both are functions again and take the same arguments:

- The name of the query to run (as expected by the server)
- The fields/attributes & relations the server should return.
  - Pass `null` if the full type is a primitive (or an array of primitives) like `number` or `string`
  - Otherwise pass `true` for attributes and an object for the relations you want to get returned.
- If `buildGraphQL` has the third type parameter, then a third argument to `query` and `mutation` is required as well.

### Example: Complex Type with Variables

```TypeScript
import { buildGraphQL } from "react-use-graphql-ts";
import { UserDTO, ErrorDTO, QueryUserVariables, queryUserVariableTypes } from '../types'; // See "Setup" section for these types

// No need to write the query as string. Write it in TypeScript and get autocompletion for free!
const userQuery = buildGraphQL<UserDTO, ErrorDTO, QueryUserVariables>().query("user", {
    // These properties will be autocompleted based on the first type argument above
    name: true,
    icon: true,
    posts: {
        id: true,
        title: true,
        hits: true,
    }
}, queryUserVariableTypes);

```

### Example: Complex Type without Variables

```TypeScript
import { buildGraphQL } from "react-use-graphql-ts";
import { UserDTO, ErrorDTO } from '../types';

const userQuery = buildGraphQL<UserDTO, ErrorDTO>().query("user", {
    name: true,
    icon: true,
    posts: {
        id: true,
        title: true,
        hits: true,
    }
});
```

### Example: Primitive Type without Variables

```TypeScript
import { buildGraphQL } from "react-use-graphql-ts";
import { ErrorDTO } from '../types';

const userQuery = buildGraphQL<number[], ErrorDTO>().query("user", null);
```
