import React from 'react'
import { Provider } from 'react-redux'
import { store } from './app/src/store'
import AppNavigator from './app/src/navigation/AppNavigator'

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  )
}
