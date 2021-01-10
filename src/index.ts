import { useLayoutEffect, useReducer, useMemo, createContext, useContext } from "react";

import { GraphQLQuery, VariableType } from "./query";

export * from "./query";

const defaultConfig = { url: "/graphql" };

const GraphQLGlobalConfigContext = createContext<GraphQLConfig<unknown, Record<string, unknown>>>(defaultConfig);
export const GraphQLGlobalConfigProvider = GraphQLGlobalConfigContext.Provider;

export interface GraphQLResponseInfo {
    /** The status code of the response */
    responseStatus: number;
    /** The headers of the response */
    responseHeaders: Headers;
}

export interface GraphQLStateBase {
    /** Request is currently in progress */
    loading: boolean;
    /** Either an exception occurred or the request returned an error */
    failed: boolean;
}

export interface GraphQLStateEmpty extends GraphQLStateBase {
    state: "empty";
    failed: false;
}

export interface GraphQLStateDone extends GraphQLStateBase, GraphQLResponseInfo {}

export interface GraphQLStateDoneSuccess<TData> extends GraphQLStateDone {
    failed: false;
    /** Data is present */
    state: "success";
    /** The response data in case of success */
    data: TData;
}

export interface GraphQLStateDoneError<TError extends Record<string, any>> extends GraphQLStateDone {
    failed: true;
    /** Errors is present */
    state: "error";
    /** Request has finished with either an error or an exception. */
    errors: TError[];
}

export interface GraphQLStateDoneException extends GraphQLStateBase {
    failed: true;
    /** Errors is present */
    state: "exception";
    /** Request has finished with either an error or an exception. */
    error: Error;
}

export type GraphQLState<TData, TError extends Record<string, any>> =
    | GraphQLStateEmpty
    | GraphQLStateDoneSuccess<TData>
    | GraphQLStateDoneError<TError>
    | GraphQLStateDoneException;

export type FetchParams = Parameters<typeof fetch>;
export type SetState<TData, TError extends Record<string, any>> = (state: GraphQLState<TData, TError>) => void;

interface GraphQLRequestInit {
    readonly method: "POST";
    credentials: RequestCredentials;
    readonly headers: Headers;
    readonly body: string;
    readonly signal: AbortSignal;
}

export interface GraphQLConfig<TData, TError extends Record<string, any>> {
    /** The url to use. Defaults to "/graphql" if neither global nor local config specifies it */
    url?: string;

    /**
     * Called right before a request will be made. Use it to extend the request with additional information like authorization headers.
     *
     * @param init The request data to be send.
     */
    onInit?(init: RequestInit & GraphQLRequestInit): void;

    /**
     * Called on successful request with the result
     *
     * @param data The result of the query/mutation
     * @param status The status code of the request
     * @param responseHeaders The response headers headers of the request
     */
    onSuccess?(data: TData, status: number, responseHeaders: Headers): void;

    /**
     * Called on server error
     *
     * @param errors The errors the server returned for the query/mutation
     * @param status The status code of the request
     * @param responseHeaders The response headers headers of the request
     */
    onError?(errors: TError[], status: number, responseHeaders: Headers): void;

    /**
     * Called when an exception happened in the frontend
     *
     * @param error The error that was thrown.
     */
    onException?(error: Error): void;
}

export interface GraphQLLocalConfig<TData, TError extends Record<string, any>, TVars extends VariableType>
    extends GraphQLConfig<TData, TError> {
    /** Specify to cause the request to be submitted automatically */
    autoSubmit?: TVars extends null ? true : TVars;
}

interface GraphQLActionLoading {
    type: "loading";
    value: boolean;
}
interface GraphQLActionSuccess<TData> extends GraphQLResponseInfo {
    type: "success";
    data: TData;
}
interface GraphQLActionError<TError extends Record<string, any>> extends GraphQLResponseInfo {
    type: "error";
    errors: TError[];
}
interface GraphQLActionException {
    type: "exception";
    error: Error;
}

type GraphQLAction<TData, TError extends Record<string, any>> =
    | GraphQLActionLoading
    | GraphQLActionSuccess<TData>
    | GraphQLActionError<TError>
    | GraphQLActionException;

function stateReducer<TData, TError extends Record<string, any>>(
    state: GraphQLState<TData, TError>,
    action: GraphQLAction<TData, TError>
): GraphQLState<TData, TError> {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.value,
            };
        case "success":
            return {
                failed: false,
                state: "success",
                loading: false,
                data: action.data,
                responseHeaders: action.responseHeaders,
                responseStatus: action.responseStatus,
            };
        case "error":
            return {
                failed: true,
                state: "error",
                loading: false,
                errors: action.errors,
                responseHeaders: action.responseHeaders,
                responseStatus: action.responseStatus,
            };
        case "exception":
            return {
                failed: true,
                state: "exception",
                loading: false,
                error: action.error,
            };
    }
    return state;
}

class GraphQLInstance<TResultData, TVars extends VariableType, TError> {
    public globalConfig?: GraphQLConfig<TResultData, TError>;

    public config?: GraphQLConfig<TResultData, TError>;

    public mounted = true;

    private query: GraphQLQuery<TResultData, TVars, TError>;

    private controller?: AbortController;

    private updateState: (action: GraphQLAction<TResultData, TError>) => void;

    public constructor(
        query: GraphQLQuery<TResultData, TVars, TError>,
        updateState: (action: GraphQLAction<TResultData, TError>) => void
    ) {
        this.query = query;
        this.updateState = updateState;
    }

    public abort = () => {
        if (this.controller) {
            this.controller.abort();
            this.controller = undefined;
            this.updateState({ type: "loading", value: false });
        }
    };

    public submit = (variables?: Record<string, any>) => {
        this.submitAsync(variables);
    };

    private async submitAsync(variables?: Record<string, any>) {
        if (!this.mounted) return;

        const globalConfig = this.globalConfig ?? (defaultConfig as GraphQLConfig<TResultData, TError>);
        const config = this.config ?? (defaultConfig as GraphQLConfig<TResultData, TError>);
        let responseStatus = -1;
        try {
            this.controller?.abort();
            this.controller = new AbortController();
            this.updateState({ type: "loading", value: true });
            const init: GraphQLRequestInit = {
                method: "POST",
                credentials: "include",
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    query: this.query.query,
                    variables,
                }),
                signal: this.controller.signal,
            };
            globalConfig.onInit?.(init);
            config.onInit?.(init);
            const url = config.url ?? globalConfig.url ?? defaultConfig.url;
            const response = await fetch(url, init);

            responseStatus = response.status;

            const json = await response.json();
            if (!this.mounted) return;

            if (response.ok && !json.errors) {
                const data: TResultData = json.data[this.query.name];
                globalConfig.onSuccess?.(data, responseStatus, response.headers);
                config.onSuccess?.(data, responseStatus, response.headers);
                this.updateState({
                    type: "success",
                    responseStatus: response.status,
                    responseHeaders: response.headers,
                    data,
                });
            } else {
                const { errors } = json;
                globalConfig.onError?.(errors, responseStatus, response.headers);
                config.onError?.(errors, responseStatus, response.headers);
                this.updateState({
                    type: "error",
                    responseStatus: response.status,
                    responseHeaders: response.headers,
                    errors,
                });
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.log(error);
                if (this.mounted) {
                    globalConfig.onException?.(error);
                    config.onException?.(error);
                    this.updateState({
                        type: "exception",
                        error,
                    });
                }
            }
        }
    }
}

export function useGraphQL<TResultData, TVars extends VariableType, TError>(
    query: GraphQLQuery<TResultData, TVars, TError>,
    config?: GraphQLLocalConfig<TResultData, TError, TVars>
): [GraphQLState<TResultData, TError>, TVars extends null ? () => void : (vars: TVars) => void, () => void] {
    const [state, updateState] = useReducer(stateReducer, {
        failed: false,
        state: "empty",
        loading: !!config?.autoSubmit,
    });
    const instance = useMemo(() => new GraphQLInstance(query, updateState), []);
    instance.globalConfig = useContext(GraphQLGlobalConfigContext) as GraphQLConfig<TResultData, TError>;
    instance.config = config;
    useLayoutEffect(() => {
        instance.mounted = true;
        if (config) {
            if (config.autoSubmit === true) instance.submit();
            else if (config.autoSubmit) instance.submit(config.autoSubmit as Record<string, any>);
        }

        return () => {
            instance.mounted = false;
            instance.abort();
        };
    }, []);
    return [state, instance.submit, instance.abort] as any;
}
