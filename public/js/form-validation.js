import { t } from './i18n.js'
// Native validation bubbles use explicit copy in the page language, not the browser language.
for (const form of document.querySelectorAll('.contact-form')) {
  for (const input of form.querySelectorAll('input,select,textarea')) {
    input.addEventListener('input', () => input.setCustomValidity(''))
    input.addEventListener('change', () => input.setCustomValidity(''))
    input.addEventListener('invalid', () => {
      input.setCustomValidity('')
      if (input.validity.valueMissing) input.setCustomValidity(t(input.name === 'privacy' ? 'Per continuare è necessario il consenso al trattamento dei dati.' : 'Compilate questo campo.'))
      else if (input.validity.typeMismatch && input.type === 'email') input.setCustomValidity(t('Inserite un indirizzo email valido.'))
    })
  }
}
