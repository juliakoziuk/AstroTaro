// Навчальний симулятор React Native: компоненти (див. index.js).
import { Children, createContext, useContext, useState } from 'react'
import { normalizeStyle } from './StyleSheet.js'

const InText = createContext(false)

const BASE_VIEW = {
  display: 'flex',
  flexDirection: 'column', // у RN колонка за замовчуванням, у вебі — рядок
  position: 'relative',
  boxSizing: 'border-box',
  flexShrink: 0,
  minWidth: 0,
  minHeight: 0,
  borderStyle: 'solid',
  borderWidth: 0,
}

// Справжній RN: «Text strings must be rendered within a <Text> component»
function checkNoRawText(children, parent) {
  Children.forEach(children, (child) => {
    if ((typeof child === 'string' && child.trim() !== '') || typeof child === 'number') {
      throw new Error(
        `Text strings must be rendered within a <Text> component. (Знайдено «${child}» прямо всередині <${parent}>.)`,
      )
    }
  })
}

export function View({ style, children, testID }) {
  checkNoRawText(children, 'View')
  return (
    <div data-testid={testID} style={{ ...BASE_VIEW, ...normalizeStyle(style) }}>
      {children}
    </div>
  )
}

export function SafeAreaView({ style, children }) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>
}

export function Text({ style, children, numberOfLines, onPress }) {
  const nested = useContext(InText)
  const Tag = nested ? 'span' : 'div'
  const base = nested
    ? {}
    : { fontSize: 14, color: '#000', fontFamily: 'system-ui, sans-serif', whiteSpace: 'pre-wrap', margin: 0 }
  const clamp = numberOfLines
    ? {
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
      }
    : {}
  return (
    <InText.Provider value={true}>
      <Tag
        style={{ ...base, ...clamp, ...normalizeStyle(style), cursor: onPress ? 'pointer' : undefined }}
        onClick={onPress}
      >
        {children}
      </Tag>
    </InText.Provider>
  )
}

function usePressed() {
  const [pressed, setPressed] = useState(false)
  return [
    pressed,
    {
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
      onMouseLeave: () => setPressed(false),
    },
  ]
}

// Увага: onClick тут свідомо НЕ підтримується — як у справжньому RN, подія називається onPress
export function Pressable({ onPress, disabled, style, children }) {
  const [pressed, handlers] = usePressed()
  const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style
  const content = typeof children === 'function' ? children({ pressed }) : children
  checkNoRawText(content, 'Pressable')
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...handlers}
      onClick={disabled ? undefined : onPress}
      onKeyDown={(e) => !disabled && e.key === 'Enter' && onPress?.(e)}
      style={{
        ...BASE_VIEW,
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        ...normalizeStyle(resolvedStyle),
      }}
    >
      {content}
    </div>
  )
}

export function TouchableOpacity({ onPress, disabled, style, activeOpacity = 0.2, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && { opacity: activeOpacity }]}
    >
      {children}
    </Pressable>
  )
}

export function Button({ title, onPress, color = '#007aff', disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ padding: 8, alignItems: 'center' }}>
      <Text style={{ color: disabled ? '#999' : color, fontSize: 17 }}>{title}</Text>
    </Pressable>
  )
}

export function TextInput({
  value,
  defaultValue,
  onChangeText,
  onChange,
  placeholder,
  secureTextEntry,
  multiline,
  editable = true,
  maxLength,
  autoFocus,
  style,
}) {
  const Tag = multiline ? 'textarea' : 'input'
  const handle = (e) => {
    // У RN подія не має target.value — текст лежить у nativeEvent.text (а target — це число)
    onChange?.({ nativeEvent: { text: e.target.value }, target: 1 })
    onChangeText?.(e.target.value)
  }
  const controlled = value !== undefined ? { value: value ?? '' } : { defaultValue }
  return (
    <Tag
      {...controlled}
      onChange={handle}
      placeholder={placeholder}
      type={secureTextEntry ? 'password' : 'text'}
      readOnly={!editable}
      maxLength={maxLength}
      autoFocus={autoFocus}
      style={{
        boxSizing: 'border-box',
        borderStyle: 'solid',
        borderWidth: 0,
        outline: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
        font: '14px system-ui, sans-serif',
        color: '#000',
        resize: 'none',
        ...normalizeStyle(style),
      }}
    />
  )
}

export function Image({ source, style, resizeMode = 'cover' }) {
  const isUri = typeof source === 'object' && source !== null && 'uri' in source
  const src = isUri ? source.uri : source
  const flat = normalizeStyle(style)
  // У RN картинки з uri без явного розміру мають розмір 0×0
  const size = isUri ? { width: 0, height: 0 } : {}
  const fit = { cover: 'cover', contain: 'contain', stretch: 'fill', center: 'none' }[resizeMode] ?? 'cover'
  return <img src={src} alt="" style={{ ...size, ...flat, objectFit: fit, display: 'block' }} />
}

export function ScrollView({ style, contentContainerStyle, horizontal, children }) {
  return (
    <div
      style={{
        ...BASE_VIEW,
        flexGrow: 1,
        flexShrink: 1,
        overflow: 'auto',
        flexDirection: horizontal ? 'row' : 'column',
        ...normalizeStyle(style),
      }}
    >
      <div
        style={{
          ...BASE_VIEW,
          flexDirection: horizontal ? 'row' : 'column',
          ...normalizeStyle(contentContainerStyle),
        }}
      >
        {children}
      </div>
    </div>
  )
}

const warned = new Set()

export function FlatList({
  data = [],
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  horizontal,
  style,
  contentContainerStyle,
}) {
  const missingKeys = !keyExtractor && data.some((d) => d?.key == null && d?.id == null)
  if (missingKeys && !warned.has('keys')) {
    warned.add('keys')
    console.warn(
      'VirtualizedList: missing keys for items, make sure to specify a key or id property on each item or provide a custom keyExtractor.',
    )
  }
  const getKey = (item, index) => keyExtractor?.(item, index) ?? item?.key ?? item?.id ?? index
  const Sep = ItemSeparatorComponent
  return (
    <ScrollView style={style} contentContainerStyle={contentContainerStyle} horizontal={horizontal}>
      {ListHeaderComponent && (typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent)}
      {data.length === 0 && ListEmptyComponent
        ? typeof ListEmptyComponent === 'function'
          ? <ListEmptyComponent />
          : ListEmptyComponent
        : data.map((item, index) => (
            <div key={getKey(item, index)} style={{ ...BASE_VIEW, flexDirection: horizontal ? 'row' : 'column' }}>
              {renderItem({ item, index })}
              {Sep && index < data.length - 1 && <Sep />}
            </div>
          ))}
      {ListFooterComponent && (typeof ListFooterComponent === 'function' ? <ListFooterComponent /> : ListFooterComponent)}
    </ScrollView>
  )
}

export function ActivityIndicator({ size = 'small', color = '#888' }) {
  const d = size === 'large' ? 36 : 20
  return (
    <span
      className="rn-spinner"
      style={{ width: d, height: d, borderColor: `${color}55`, borderTopColor: color }}
    />
  )
}

export function Switch({ value, onValueChange }) {
  return (
    <input
      type="checkbox"
      role="switch"
      checked={!!value}
      onChange={(e) => onValueChange?.(e.target.checked)}
      style={{ width: 40, height: 22 }}
    />
  )
}

export function StatusBar() {
  return null
}
