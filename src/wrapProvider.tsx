import * as React from 'react'
import { bind, transform, isString, isArray } from './utils'
import {
  set,
  touchField,
  untouchField,
  isDirty,
  resetFields,
  setFieldValue,
  blurField,
  untouchAllFields,
  validateField,
  clearFields,
  getFormValue,
  formIsValid,
  getInitialFieldState,
  getStartingState,
  initializeState,
  reinitializeState,
  setAll,
  modifyFields
} from './state'
import { trueIfAbsent, isEqual } from './utils'
import {
  FormProviderConfig,
  FormProviderState,
  Validator,
  Provider,
  FieldState,
  FieldOptions,
  ValidationType,
  ValidateOn
} from './sharedTypes'

const noop = (...params: any[]) => {
  console.log('not loaded or field non existent')
}

const default_validate_on: ValidationType = 'submit'

function onlyIfLoaded(func: Function, defaultFunc = noop) {
  func = bind(this, func)
  // todo check what affect this has on component prototype
  return bind(this, function(...params: any[]) {
    if (!this.state.isBusy) {
      return func(...params)
    }
    return defaultFunc(...params)
  })
}

function onlyIfFieldExists(func: Function, defaultFunc = noop) {
  func = bind(this, func)
  return bind(this, function(fieldName: string, ...params: any[]) {
    if (this.state.fields[fieldName]) {
      return func(fieldName, ...params)
    }
    return defaultFunc(...params)
  })
}

const incl = (arrayOrString: ValidationType[] | ValidationType, value: ValidationType) => {
  return (arrayOrString as string[] & string).includes(value)
}

const defaultMessages: string[] = []

export function wrapProvider<T>(Provider: React.Provider<Provider<T>>, initialValue?: T) {
  type VR = { [K in keyof T]: string[] }
  type PVS = { [P in keyof T]: Validator<T, P>[] }
  type FVO = { [P in keyof T]: FieldOptions<T, P> }
  type FPP = FormProviderConfig<T>
  type FPS = FormProviderState<T>

  type ComputedFormState = {
    formIsDirty: boolean
    formIsTouched: boolean
    formIsValid: boolean
    validation: { [K in keyof T]: string[] }
  }

  return class Form extends React.Component<FPP, FPS> {
    validators = {} as PVS
    validationOptions = {} as FVO

    constructor(props: FPP) {
      super(props)

      const loadedGuard = bind(this, onlyIfLoaded)
      const existsGuard = bind(this, onlyIfFieldExists)
      const loadedAndExists = (func: Function, defaultFunc = noop) => {
        func = loadedGuard(func, defaultFunc)
        func = existsGuard(func, defaultFunc)
        return func as any
      }

      this.submit = loadedGuard(this.submit)
      this.getFormValue = loadedGuard(this.getFormValue)
      this.setFieldValue = loadedAndExists(this.setFieldValue)
      this.setFieldValues = loadedGuard(this.setFieldValues)
      this.onFieldBlur = loadedAndExists(this.onFieldBlur)
      this.unload = loadedGuard(this.unload)
      this.forgetState = loadedGuard(this.forgetState)
      this.clearForm = loadedGuard(this.clearForm)
      this.touchField = loadedAndExists(this.touchField)
      this.untouchField = loadedAndExists(this.untouchField)
      this.resetForm = loadedGuard(this.resetForm)
      this.validateForm = loadedGuard(this.validateForm, () => ({}))
      this.registerField = bind(this, this.registerField)
      this.registerValidator = bind(this, this.registerValidator)
      this.getComputedState = bind(this, this.getComputedState)
      this.getProviderValue = bind(this, this.getProviderValue)
      this.shouldFieldValidate = loadedAndExists(this.shouldFieldValidate, () => false)
      this.getMessagesFor = loadedAndExists(this.getMessagesFor, () => [])
      this.state = getStartingState<T>(initialValue)
    }

    static getDerivedStateFromProps = getGetDerivedStateFromProps<T>()

    static defaultProps = {
      allowReinitialize: false,
      validateOn: default_validate_on
    }

    registerValidator<K extends keyof T>(
      fieldName: K,
      validators: Validator<T, K>[],
      validateOn: ValidateOn<T, K> = this.props.validateOn || default_validate_on
    ): void {
      this.validators[fieldName] = validators
      this.validationOptions[fieldName] = {
        validateOn
      }
    }

    registerField<K extends keyof T>(
      fieldName: K,
      value: T[K],
      validators: Validator<T, K>[],
      opts: Partial<FieldOptions<T, K>> = {}
    ) {
      this.registerValidator(fieldName, validators, opts.validateOn)
      if (this.state.fields[fieldName]) return // field is already registered
      this.setState(({ fields }) => ({
        fields: set(fields, fieldName, () => getInitialFieldState(value))
      }))
    }

    submit(): void {
      this.setState(({ fields, submitCount }) => ({
        // fields: touchAllFields(fields),
        submitCount: submitCount + 1
      }))

      if (formIsValid<T>(this.validateForm())) {
        const { submit = noop } = this.props
        submit(this.getFormValue())
      } else {
        console.warn('cannot submit, form is not valid...')
      }
    }

    getFormValue(): T {
      return getFormValue<T>(this.state.fields)
    }

    setFieldValue<P extends keyof T>(fieldName: P, val: T[P]): void {
      this.setState(({ fields }) => ({
        fields: set(fields, fieldName, (field: FieldState<T[P]>) => setFieldValue(field, val))
      }))
    }

    setFieldValues(partialUpdate: Partial<T>): void {
      this.setState(({ fields }) => ({
        fields: modifyFields(fields, partialUpdate, setFieldValue)
      }))
    }

    touchField<K extends keyof T>(fieldName: K): void {
      this.setState(({ fields }) => ({
        fields: set(fields, fieldName, touchField)
      }))
    }

    touchFields(fieldNames: (keyof T)[]): void {
      fieldNames = fieldNames || (Object.keys(this.state.fields) as (keyof T)[])
      this.setState(({ fields }) => ({ fields: setAll(fields, fieldNames, touchField) }))
    }

    untouchField<K extends keyof T>(fieldName: K): void {
      this.setState(({ fields }) => ({
        fields: set(fields, fieldName, untouchField)
      }))
    }

    untouchFields(fieldNames: (keyof T)[]): void {
      fieldNames = fieldNames || (Object.keys(this.state.fields) as (keyof T)[])
      this.setState(({ fields }) => ({ fields: setAll(fields, fieldNames, untouchField) }))
    }

    onFieldBlur<K extends keyof T>(fieldName: K): void {
      if (this.state.fields[fieldName].didBlur) return
      this.setState(({ fields }) => ({
        fields: set(fields, fieldName, blurField)
      }))
    }

    clearForm(): void {
      this.setState({ fields: clearFields<T>(this.state.fields) })
    }

    resetForm(): void {
      this.setState({ fields: resetFields<T>(this.state.fields) })
    }

    unload(): void {
      this.setState(getStartingState<T>())
    }

    forgetState(): void {
      this.setState(({ fields }) => ({ fields: untouchAllFields(fields), submitCount: 0 }))
    }

    validateForm(): VR {
      const { fields } = this.state
      const result = transform<PVS, VR>(this.validators, (ret, validators, fieldName) => {
        ret[fieldName] = validateField<T>(fieldName, fields, validators)
        return ret
      })
      return result
    }

    shouldFieldValidate(fieldName: keyof T): boolean {
      const o = this.validationOptions[fieldName]
      // if a field was not registered the below will be
      // have to return false. this is the case when a field is 'registered'
      // via an initial value on the provider but no field consumer was mounted
      // todo register fields from initial value on provider props
      if (!o) return false
      const validateOn = o.validateOn || this.props.validateOn || default_validate_on
      const { fields, submitCount } = this.state
      const field = fields[fieldName]

      if (typeof validateOn === 'function') {
        return validateOn(field, fields)
      }
      if (!isArray(validateOn) && !isString(validateOn)) {
        return false
      }
      if (incl(validateOn, 'change') && field.touched) {
        return true
      }
      if (incl(validateOn, 'blur') && field.didBlur) {
        return true
      }
      if (incl(validateOn, 'submit') && submitCount > 0) {
        return true
      }
      return false
    }

    getMessagesFor(fieldName: keyof T): string[] {
      return this.shouldFieldValidate(fieldName)
        ? validateField<T>(fieldName, this.state.fields, this.validators[fieldName])
        : defaultMessages
    }

    getComputedState(): ComputedFormState {
      const { fields } = this.state
      const keys = Object.keys(fields) as (keyof T)[]
      let formIsDirty = false
      let formIsInvalid = false
      let formIsTouched = false
      let validation = {} as VR

      for (let fieldName of keys) {
        formIsDirty = formIsDirty || isDirty(fields[fieldName])
        formIsTouched = formIsTouched || fields[fieldName].touched
        validation[fieldName] = this.getMessagesFor(fieldName)
        formIsInvalid = formIsInvalid || validation[fieldName].length > 0
      }

      return {
        formIsDirty,
        formIsTouched,
        validation,
        formIsValid: !formIsInvalid
      }
    }

    getProviderValue(): Provider<T> {
      return {
        ...this.state,
        ...this.getComputedState(),
        unload: this.unload,
        submit: this.submit,
        clearForm: this.clearForm,
        touchFields: this.touchFields,
        untouchFields: this.untouchFields,
        touchField: this.touchField,
        untouchField: this.untouchField,
        resetForm: this.resetForm,
        forgetState: this.forgetState,
        getFormValue: this.getFormValue,
        onFieldBlur: this.onFieldBlur,
        setFieldValue: this.setFieldValue,
        setFieldValues: this.setFieldValues,
        registerField: this.registerField,
        registerValidator: this.registerValidator
      }
    }

    render() {
      return <Provider value={this.getProviderValue()}>{this.props.children}</Provider>
    }
  }
}

function getGetDerivedStateFromProps<T>() {
  return (np: FormProviderConfig<T>, ps: FormProviderState<T>): Partial<FormProviderState<T>> => {
    let state: Partial<FormProviderState<T>> = {}
    const loaded = trueIfAbsent(np.loaded)
    if (!ps.loaded && loaded) {
      let initialValue = np.initialValue || ({} as T)
      state.initialValue = initialValue
      state.fields = Object.assign({}, ps.fields, initializeState<T>(initialValue))
    } else if (ps.loaded && !loaded) {
      state = getStartingState<T>()
      state.fields = clearFields(ps.fields)
    }

    if (np.allowReinitialize && !isEqual(ps.initialValue, np.initialValue)) {
      if (np.initialValue) {
        if (np.rememberStateOnReinitialize) {
          state.fields = reinitializeState<T>(np.initialValue, ps.fields)
        } else {
          state.fields = initializeState<T>(np.initialValue)
          state.submitCount = 0
        }
        state.initialValue = np.initialValue
      } else {
        if (np.rememberStateOnReinitialize) {
          state.submitCount = 0
        }
        state.initialValue = getFormValue<T>(clearFields(ps.fields))
        state.fields = initializeState<T>(state.initialValue)
      }
    }

    if (!ps.loaded) {
      state.loaded = loaded
    }

    state.submitting = np.submitting
    state.isBusy = !loaded || np.submitting || false

    return state
  }
}