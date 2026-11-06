import JsxLesson from './01-jsx/JsxLesson.jsx'
import ComponentsLesson from './02-components/ComponentsLesson.jsx'
import EventsFormsLesson from './03-events-forms/EventsFormsLesson.jsx'
import ListsLesson from './04-lists/ListsLesson.jsx'
import UseStateLesson from './05-use-state/UseStateLesson.jsx'
import UseEffectLesson from './06-use-effect/UseEffectLesson.jsx'
import UseRefLesson from './07-use-ref/UseRefLesson.jsx'
import UseContextLesson from './08-use-context/UseContextLesson.jsx'
import MemoLesson from './09-memo/MemoLesson.jsx'
import ReducerHooksLesson from './10-reducer-hooks/ReducerHooksLesson.jsx'
import DataLesson from './11-data/DataLesson.jsx'
import StylesLesson from './12-styles/StylesLesson.jsx'
import NavigationLesson from './13-navigation/NavigationLesson.jsx'
import NativeLesson from './14-native/NativeLesson.jsx'
import FinalLesson from './15-final/FinalLesson.jsx'

// Page: null — урок ще не написаний, у меню він сірий.
const lessons = [
  { id: 'jsx', title: '1. JSX', minutes: 8, Page: JsxLesson },
  { id: 'components', title: '2. Компоненти, props, children', minutes: 10, Page: ComponentsLesson },
  { id: 'events-forms', title: '3. Події та форми', minutes: 12, Page: EventsFormsLesson },
  { id: 'lists', title: '4. Умови та списки (key)', minutes: 10, Page: ListsLesson },
  { id: 'use-state', title: '5. useState', minutes: 12, Page: UseStateLesson },
  { id: 'use-effect', title: '6. useEffect', minutes: 15, Page: UseEffectLesson },
  { id: 'use-ref', title: '7. useRef', minutes: 8, Page: UseRefLesson },
  { id: 'use-context', title: '8. useContext', minutes: 10, Page: UseContextLesson },
  { id: 'memo', title: '9. memo, useMemo, useCallback', minutes: 10, Page: MemoLesson },
  { id: 'reducer-hooks', title: '10. useReducer і власні хуки', minutes: 12, Page: ReducerHooksLesson },
  { id: 'data', title: '11. Дані з API (loading / error)', minutes: 12, Page: DataLesson },
  { id: 'styles', title: '12. Стилі та Flexbox', minutes: 12, Page: StylesLesson },
  { id: 'navigation', title: '13. Навігація між екранами', minutes: 10, Page: NavigationLesson },
  { id: 'native', title: '14. Від React до React Native', minutes: 15, Page: NativeLesson },
  { id: 'final', title: '15. Фінальний тест', minutes: 30, Page: FinalLesson },
]

export default lessons
