import { useEffect, useRef, useState, useCallback } from "react";

const UseStateWithCallback = (initialState) => {
  const [state, setState] = useState(initialState);
  const cbRef = useRef(null);

  const updateState = useCallback((newState, cb) => {
    cbRef.current = cb;

    setState((prev) =>
      typeof newState === "function" ? newState(prev) : newState
    );
  }, []);

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, updateState];
};

export default UseStateWithCallback;