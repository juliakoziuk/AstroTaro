import { useReducer } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'inc':
      return { count: state.count + 1 }
    default:
      return state
  }
}

export default function WrongAction() {
  const [state, dispatch] = useReducer(reducer, { count: 0 })

  return (
    <div>
      <button onClick={() => dispatch('inc')}>+1</button>
      <p>Лічильник: {state.count}</p>
    </div>
  )
}
