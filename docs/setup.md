# Setup

## TypeScript

Ensure you have at least TypeScript 4.1 in your setup.

## Install With NPM

```
npm i react-use-graphql-ts
```

## Install With Yarn

```
yarn add react-use-graphql-ts
```

## Define Types

Define your full types somewhere (i.e. all types and attributes that could possibly be requested), for example:

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