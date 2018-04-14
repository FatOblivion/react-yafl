/// <reference types="react" />
import * as React from 'react';
import { FormProviderState, FormProviderOptions, FormProviderProps, FormValidationResult } from '../';
export declare type FPS<T> = FormProviderState<T>;
export declare type FCS<T> = FPS<T>;
export declare type FPP<T> = FormProviderProps<T>;
export declare type FPO<T> = FormProviderOptions<T>;
export declare type FVR<T> = FormValidationResult<T>;
declare function wrapFormProvider<T>(Provider: React.Provider<FPS<T>>, opts: FPO<T>): React.ComponentClass<FPP<T>>;
export default wrapFormProvider;
