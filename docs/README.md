---
home: true
heroText: react-use-graphql-ts
tagline: A lightweight, type-safe graphql hook for react, written in TypeScript.
actionText: Get Started →
actionLink: /setup
features:
- title: No Query Strings!
  details: Don't write query strings manually. Write TypeScript and get autocompletion for free!
- title: Type-Safe
  details: Instead of getting the full interface as a result type from a query/mutation, you only get those fields you actually selected in the query!
- title: Easy to Use
  details: "Write your types, define queries/mutations, use the hook, display data => done!"
footer: Zlib/Libpng License | Copyright © 2021 Santo Pfingsten
---

This is no code-generator. It works purely by using TypeScript 4.1 features.

This is a **Work In Progress**! The API might change before version 1.0 is released.

### Overview

- [Setup & Preparations](setup.md)
- [Define Queries & Mutations](query.md)
- [useGraphQL Hook](hook.md)
- [Local and Global Config](config.md)

### Simple Example

This is an example of how a query might be used:

Define your full types somewhere (i.e. all types and attributes that could possibly be requested)
```TypeScript
import { GraphGLVariableTypes } from "react-use-graphql-ts";

export interface ErrorDTO {
    message: string;
}

export interface PostDTO {
    id: number;
    title: string;
    message: string;
    hits: number;
    user: UserDTO;
}

export interface UserDTO {
    id: string;
    name: string;
    icon: string;
    age: number;
    posts: PostDTO[];
}

export interface QueryUserVariables {
    id: string;
}

// Also specify GraphQL variable types as a constant like this:
const queryUserVariableTypes: GraphGLVariableTypes<QueryUserVariables> = {
    // These will be autocompleted (and are required) based on the type argument above
    // The values here are the only place where you still need to write GraphQL types.
    id: "String!",
};

```

Then, in your component file, define your customized query and use it in a component:
```tsx
import React from 'react';
import { buildGraphQL, useGraphQL } from "react-use-graphql-ts";
import { UserDTO, ErrorDTO, QueryUserVariables, queryUserVariableTypes } from '../types';

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

export function UserSummary({ id }: UserSummaryProps) {
    // autoSubmit results in the query being send instantly. You can trigger it manually as well.
    // It is possible to supply the url globally using a provider
    const [userState] = useGraphQL(userQuery, { url: "/graphql", autoSubmit: { id } });

    // There is more state information available. This is just kept short for an overview!
    if (userState.state !== "success") return <div>Loading</div>;

    // Unless you checked for state === "success", userState.data will not exist on the type.
    const user = userState.data;
    return (
        <ul>
            <li>Name: {user.name}</li>
            <li>Icon: <img src={user.icon} alt="User Icon" /></li>
            <li>Age: {user.age /* Error: No property 'age' on user! */}</li>
            <li>Posts:
                <ul>
                    {user.posts.map((post) => (
                        <li key={post.id}>{post.title} with {post.hits} hits</li>
                    ))}
                </ul>
            </li>
        </ul>
    );
}

```
In the above example, the type of `userState.data` is automatically created by inspecting the attribute choices specified in the query definition.

So the properties `id` and `age` on UserDTO as well as the properties `message` and `user` on the PostDTO do not exist on this type and will lead to a compile-time error. For all other properties you will get autocompletion and type-safety.
