/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as ApiD4aiChatRouteImport } from './routes/api/d4ai.chat'
import { Route as ApiD4aiLiveRouteImport } from './routes/api/d4ai.live'
import { Route as ApiD4aiStreamRouteImport } from './routes/api/d4ai.stream'
import { Route as ApiD4aiTtsRouteImport } from './routes/api/d4ai.tts'
import { Route as ApiD4aiVoiceRouteImport } from './routes/api/d4ai.voice'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const ApiD4aiChatRoute = ApiD4aiChatRouteImport.update({ id: '/api/d4ai/chat', path: '/api/d4ai/chat', getParentRoute: () => rootRouteImport } as any)
const ApiD4aiLiveRoute = ApiD4aiLiveRouteImport.update({ id: '/api/d4ai/live', path: '/api/d4ai/live', getParentRoute: () => rootRouteImport } as any)
const ApiD4aiStreamRoute = ApiD4aiStreamRouteImport.update({ id: '/api/d4ai/stream', path: '/api/d4ai/stream', getParentRoute: () => rootRouteImport } as any)
const ApiD4aiTtsRoute = ApiD4aiTtsRouteImport.update({ id: '/api/d4ai/tts', path: '/api/d4ai/tts', getParentRoute: () => rootRouteImport } as any)
const ApiD4aiVoiceRoute = ApiD4aiVoiceRouteImport.update({ id: '/api/d4ai/voice', path: '/api/d4ai/voice', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/api/d4ai/chat': typeof ApiD4aiChatRoute
  '/api/d4ai/live': typeof ApiD4aiLiveRoute
  '/api/d4ai/stream': typeof ApiD4aiStreamRoute
  '/api/d4ai/tts': typeof ApiD4aiTtsRoute
  '/api/d4ai/voice': typeof ApiD4aiVoiceRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/api/d4ai/chat': typeof ApiD4aiChatRoute
  '/api/d4ai/live': typeof ApiD4aiLiveRoute
  '/api/d4ai/stream': typeof ApiD4aiStreamRoute
  '/api/d4ai/tts': typeof ApiD4aiTtsRoute
  '/api/d4ai/voice': typeof ApiD4aiVoiceRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/api/d4ai/chat': typeof ApiD4aiChatRoute
  '/api/d4ai/live': typeof ApiD4aiLiveRoute
  '/api/d4ai/stream': typeof ApiD4aiStreamRoute
  '/api/d4ai/tts': typeof ApiD4aiTtsRoute
  '/api/d4ai/voice': typeof ApiD4aiVoiceRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}
const rootRouteChildren = {
  IndexRoute,
  LoginRoute,
  ApiD4aiChatRoute,
  ApiD4aiLiveRoute,
  ApiD4aiStreamRoute,
  ApiD4aiTtsRoute,
  ApiD4aiVoiceRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
