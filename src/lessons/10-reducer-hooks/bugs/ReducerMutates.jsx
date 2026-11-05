import { useReducer } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      state.items.push('Елемент ' + (state.items.length + 1))
      return { ...state }
    default:
      return state
  }
}

export default function ReducerMutates() {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  return (
    <div>
      <button onClick={() => dispatch({ type: 'add' })}>Додати один елемент</button>
      <ul>
        {state.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
