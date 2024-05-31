import type { RealTimeVADOptions } from "@ricky0123/vad-web"
import { MicVAD, defaultRealTimeVADOptions } from "@ricky0123/vad-web"
import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react"

export { utils } from "@ricky0123/vad-web"

interface ReactOptions {
  startOnReady: boolean
  userSpeakingThreshold: number
  initOnLoad: boolean
}

export type ReactRealTimeVADOptions = RealTimeVADOptions & ReactOptions

const defaultReactOptions: ReactOptions = {
  initOnLoad: true,
  startOnReady: true,
  userSpeakingThreshold: 0.6,

}

export const defaultReactRealTimeVADOptions = {
  ...defaultRealTimeVADOptions,
  ...defaultReactOptions,
}

const reactOptionKeys = Object.keys(defaultReactOptions)
const vadOptionKeys = Object.keys(defaultRealTimeVADOptions)


const _pick = (obj: any, keys: string[]) => {
  return keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})
}

export function useMicVAD(inputOptions: Partial<ReactRealTimeVADOptions>) {
  const [userSpeaking, setUserSpeaking] = useState(false)
  const { reactOptions, vadOptions } = useMemo(() => {
    const defaultOptions = { ...defaultReactRealTimeVADOptions, ...inputOptions }
    const reactOptions = _pick(defaultOptions, reactOptionKeys) as ReactOptions
    const vadOptions = _pick(defaultOptions, vadOptionKeys) as RealTimeVADOptions
    vadOptions.onFrameProcessed = ({ isSpeech }) => setUserSpeaking(isSpeech > reactOptions.userSpeakingThreshold)
    return { reactOptions, vadOptions }
  }, [inputOptions])

  const [vad, setVAD] = useState<MicVAD | undefined>()
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState<false | string>(false)
  const [listening, setListening] = useState(false)

  const ready = useMemo(() => {
    // Create a helper for resolving the readiness state
    return Boolean(vad && !loading && !errored)
  }, [vad, loading, errored])

  const terminate = useCallback(() => {
    if (!vad) return console.warn('VAD: Cannot terminate while uninstatiated')
    vad.destroy() // Immediately destroy voice detection & associated streams
    setVAD(undefined) // Clear the vad object state
    setLoading(false) // Indicate that no loaidng operation is occuring
    setErrored(false) // Unset any errors that may have occured
    setListening(false) // Indicate that listening has stopped
  }, [vad])

  const initialize = useCallback(async () => {
    if (loading) return console.warn('VAD: Cannot initialize while loading')
    if (errored) return console.warn('VAD: Cannot initialize while in error state')
    if (ready) terminate() // Kill any previously initialized vad
    setLoading(true) // Indicate that the vad subsystem is loading
    try {setVAD(await MicVAD.new(vadOptions))} // Initialize a new vad object
    catch (e) { setErrored(((e as Error).message || e) as string) } // report any errors
    finally { setLoading(false) } // Then remove the loading flag
  }, [errored, loading, ready, terminate, vadOptions])

  const start = useCallback(() => {
    if (!ready) return console.warn('VAD: Cannot start until ready')
    setListening(true) // Indicate that listening has started
    vad?.start() // And start voice detection
  }, [ready, vad])

  const pause = useCallback(() => {
    if (!ready) return console.warn('VAD: Cannot pause until ready')
    setListening(false) // Indicate that listening has stopped
    vad?.pause() // And pause voice detection
  }, [ready, vad])

  const toggle = useCallback(() => {
    // Create a helper for toggling voice detection on/off
    return listening ? pause() : start()
  }, [listening, pause, start])

  useEffect(() => {
    if (reactOptions.initOnLoad) initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactOptions.initOnLoad])

  useEffect(() => {
    if (ready && reactOptions.startOnReady) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return {
    loading, errored, ready,
    listening, userSpeaking,
    initialize, terminate,
    start, pause, toggle,
  }
}
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined"
    ? React.useLayoutEffect
    : React.useEffect
