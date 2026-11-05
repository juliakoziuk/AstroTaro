import { useReducer } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'inc':
      { count: state.count + 1 }
      break
    default:
      return state
  }
}

export default function ReducerNoReturn() {
  const [state, dispatch] = useReducer(reducer, { count: 0 })

  return (
    <div>
      <button onClick={() => dispatch({ type: 'inc' })}>+1</button>
      <p>Лічильник: {state.count}</p>
    </div>
  )
}
