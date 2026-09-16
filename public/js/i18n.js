const messages = JSON.parse(document.querySelector('#i18n-messages')?.textContent || '{}')
export function t(source, values = {}) {
  if (!Object.hasOwn(messages, source)) throw new Error('Missing interface translation: '+source)
  return messages[source].replace(/%(\w+)%/g, (token,key) => values[key] ?? token)
}
