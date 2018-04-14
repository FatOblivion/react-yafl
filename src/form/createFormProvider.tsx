import * as React from 'react'
import { getInitialFieldState } from './getInitialState'
import {
  // noops,
  getGetDerivedStateFromProps,
  getNullState,
  validateField,
  untouchAllFields,
  touchAllFields,
  formIsValid,
  getFormValue,
  resetFields,
  formIsDirty,
  setFieldValue,
  blurField
} from './index'
import {
  FormProviderState,
  FormProviderOptions,
  FormProviderProps,
  ProviderValue,
  Validator,
  FormValidationResult,
  FieldName,
  ValidatorSet
} from '../'
import { bind, clone, transform } from '../utils'

export type FPS<T> = FormProviderState<T>
export type FCS<T> = FPS<T> //FormComponentState
export type FPP<T> = FormProviderProps<T>
export type FPO<T> = FormProviderOptions<T>
export type FVR<T> = FormValidationResult<T>

const noop = () => {}

function wrapFormProvider<T>(
  Provider: React.Provider<FPS<T>>,
  opts: FPO<T>
): React.ComponentClass<FPP<T>> {
  class Form extends React.Component<FPP<T>, FCS<T>> {
    validators: Partial<ValidatorSet<T>> = {}

    constructor(props) {
      super(props)
      const onlyIfLoaded = (func, defaultFunc = noop) => {
        func = bind(this, func)
        return bind(this, function(...params) {
          if (!this.state.isBusy) {
            return func(...params)
          }
          return defaultFunc
        })
      }
      this.submit = onlyIfLoaded(this.submit)
      this.setFieldValue = onlyIfLoaded(this.setFieldValue)
      this.onFieldBlur = onlyIfLoaded(this.onFieldBlur)
      this.unload = onlyIfLoaded(this.unload)
      this.forgetState = onlyIfLoaded(this.forgetState)
      this.clearForm = onlyIfLoaded(this.clearForm)
      this.formIsDirty = onlyIfLoaded(this.formIsDirty, () => false)
      this.validateForm = onlyIfLoaded(this.validateForm, () => ({}))
      this.registerField = bind(this, this.registerField)
      this.registerValidator = bind(this, this.registerValidator)
      this.getProviderValue = bind(this, this.getProviderValue)
    }

    static getDerivedStateFromProps = getGetDerivedStateFromProps<T>(opts)

    state = getNullState<T>()

    submit() {
      this.setState(({ value, submitCount }) => ({
        value: touchAllFields(value),
        submitCount: submitCount + 1
      }))

      if (formIsValid<T>(this.validateForm())) {
        const { submit = noop } = this.props
        submit(getFormValue<T>(this.state.value))
      } else {
        console.warn('cannot submit, form is not valid...')
      }
    }

    setFieldValue(fieldName: FieldName<T>, val: any) {
      const value = clone(this.state.value)
      value[fieldName] = setFieldValue(value[fieldName], val)
      this.setState(state => ({ value }))
    }

    onFieldBlur(fieldName: FieldName<T>) {
      if (this.state.value[fieldName].didBlur) return
      const value = clone(this.state.value)
      value[fieldName] = blurField(value[fieldName])
      this.setState({ value })
    }

    unload() {
      this.setState(getNullState<T>())
    }

    forgetState() {
      this.setState(({ value }) => ({ value: untouchAllFields(value), submitCount: 0 }))
    }

    validateForm(): FormValidationResult<T> {
      type PVS = Partial<ValidatorSet<T>>
      const form = this.state.value
      const result = transform<PVS, FVR<T>>(this.validators, (ret, validators, fieldName) => {
        ret[fieldName] = validateField<T>(fieldName, form, validators)
        return ret
      })
      return result
    }

    clearForm() {
      this.setState({ value: resetFields<T>(this.state.value) })
    }

    registerField(fieldName: FieldName<T>, value: T[keyof T], validators: Validator<T>[]) {
      this.registerValidator(fieldName, validators)
      this.setState(s => {
        const state = clone(s)
        const field = state.value[fieldName]
        const val = field ? field.value || value : value
        state.value[fieldName] = getInitialFieldState(val || value)
        return state
      })
    }

    formIsDirty(): boolean {
      return formIsDirty(this.state.value)
    }

    registerValidator(fieldName: FieldName<T>, validators: Validator<T>[]) {
      this.validators[fieldName] = validators
    }

    getProviderValue(): ProviderValue<T> {
      // const { initialValue, ...state } = this.state
      return {
        ...this.state,
        unload: this.unload,
        submit: this.submit,
        clearForm: this.clearForm,
        forgetState: this.forgetState,
        formIsDirty: this.formIsDirty(),
        onFieldBlur: this.onFieldBlur,
        validation: this.validateForm(),
        setFieldValue: this.setFieldValue,
        registerField: this.registerField,
        registerValidator: this.registerValidator
      }
    }

    render() {
      return <Provider value={this.getProviderValue()}>{this.props.children}</Provider>
    }
  }

  return Form
}

export default wrapFormProvider
