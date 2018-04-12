/// <reference types="react" />
import * as React from 'react'
declare module 'react' {
  type Provider<T> = React.ComponentType<{
    value: T
    children?: React.ReactNode
  }>
  type Consumer<T> = React.ComponentType<{
    children: (value: T) => React.ReactNode
    unstable_observedBits?: number
  }>
  interface Context<T> {
    Provider: Provider<T>
    Consumer: Consumer<T>
  }
  function createContext<T>(
    defaultValue: T,
    calculateChangedBits?: (prev: T, next: T) => number
  ): Context<T>
}
export declare type FieldName<T> = keyof T
export interface BoolFunc {
  (props: any): boolean
}
export interface FieldState {
  value: any
  didBlur: boolean
  touched: boolean
  originalValue: any
}
export declare type FormFieldState<T> = { [k in keyof T]: FieldState }
export interface FormProviderState<T> {
  value: FormFieldState<T>
  isBusy: boolean
  loaded: boolean
  submitting: boolean
  submitCount: number
}
export interface FormProviderProps<T> {
  initialValue?: T
  submit?: (formValue: T) => void
  children: React.ReactNode
  loaded?: boolean
  submitting?: boolean
}
export interface Validator {
  (value: any, formValue: any): string | undefined
}
export declare type ValidatorSet<T> = { [P in FieldName<T>]: Validator[] }
export interface FormComponentWrapper<T> {
  render?: (state: FormBaseContextReceiverProps<T>) => React.ReactNode
  component?: React.ComponentType<FormBaseContextReceiverProps<T>> | React.ComponentType<any>
  [key: string]: any
}
export interface FormFieldProps<T> extends FormComponentWrapper<T> {
  name: FieldName<T>
  validators?: Validator[]
}
export interface FormProviderOptions<T> {
  initialValue: T
  getInitialValueAsync?: () => Promise<T>
  submit?: (formValue: T) => void
}
export declare type ValidationResult = string[]
export interface FieldValidationResult {
  isValid: boolean
  messages: ValidationResult
}
export declare type FormValidationResult<T> = { [K in keyof T]: string[] }
export interface FormBaseContextReceiverProps<T> {
  submit: () => void
  setFieldValue: (fieldName: FieldName<T>, value: any) => void
  submitCount: number
  value: FormFieldState<T>
  loaded: boolean
  unload: () => void
  submitting: boolean
  forgetState: () => void
  clearForm: () => void
  [key: string]: any
}
export interface FormContextReceiverProps<T> extends FormBaseContextReceiverProps<T> {
  name: FieldName<T>
  onChange: (value: any) => void
  value: any
  didBlur: boolean
  isDirty: boolean
  touched: boolean
  onBlur: (e) => void
  unload: () => void
  validation: FieldValidationResult
}
export interface ReactContextForm<T> {
  Form: React.ComponentClass<FormProviderProps<T>>
  Field: React.ComponentClass<FormFieldProps<T>>
  FormComponent: React.ComponentClass<FormComponentWrapper<T>>
}
export interface ProviderValue<T> {
  value: FormFieldState<T>
  unload: () => void
  loaded: boolean
  submitting: boolean
  isBusy: boolean
  forgetState: () => void
  submit: () => void
  submitCount: number
  clearForm: () => void
  validation: FormValidationResult<T>
  registerValidator: RegisterValidator<T>
  onFieldBlur: (fieldName: FieldName<T>) => void
  setFieldValue: (fieldName: FieldName<T>, value: any) => void
}
export interface BaseFormComponentProps<T> {
  submitCount: number
  clearForm: () => void
  unload: () => void
  forgetState: () => void
  submitting: boolean
  submit: () => void
  setFieldValue: (fieldName: FieldName<T>, value: any) => void
}
export interface BaseInnerFieldProps<T> extends BaseFormComponentProps<T> {
  name: FieldName<T>
  isDirty: boolean
  state: FieldState
  onBlur?: (e) => void
  validators?: Validator[]
  validation: ValidationResult
  registerValidator: RegisterValidator<T>
  onFieldBlur: (fieldName: FieldName<T>) => void
  render?: (value) => React.ReactNode
  component?: React.ComponentType<FormContextReceiverProps<T>> | React.ComponentType<any>
}
export interface FormComponentProps<T> extends BaseFormComponentProps<T> {
  loaded: boolean
  value: FormFieldState<T>
  render?: (value: FormBaseContextReceiverProps<T>) => React.ReactNode
  component?: React.ComponentType<FormBaseContextReceiverProps<T>> | React.ComponentType<any>
}
export declare type InnerFieldProps<T> = BaseInnerFieldProps<T> & FieldState
export interface RegisterValidator<T> {
  (fieldName: FieldName<T>, validators: Validator[]): any
}
export declare function createForm<T>(initialState?: T): ReactContextForm<T>