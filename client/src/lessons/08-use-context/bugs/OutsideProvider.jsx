import { createContext, useContext } from 'react'

const LangContext = createContext('en')

function Hello() {
  const lang = useContext(LangContext)
  return <p>{lang === 'uk' ? 'Привіт!' : 'Hello!'}</p>
}

export default function OutsideProvider() {
  return (
    <div>
      <LangContext value="uk">
        <Hello />
      </LangContext>
      <Hello />
    </div>
  )
}
