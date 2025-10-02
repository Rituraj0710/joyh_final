'use client'
import { Provider } from 'react-redux'
import { store } from '../lib/store';
import { LanguageProvider } from '../context/LanguageContext';

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </Provider>
  )
}