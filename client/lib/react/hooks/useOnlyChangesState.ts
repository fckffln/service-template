import { useCallback, useEffect, useRef, useState } from 'react';
import isEqual from '@shared/data/isEqual';

export default function <T>(
    value: T,
    ref: boolean = false,
): [T | null, (value: T | null | ((current: T | null) => T | null)) => void] {
    const prevValueRef = useRef(value);
    const [current, next] = useState(value);
    if (ref) {
        useEffect(() => {
            if (!isEqual(prevValueRef.current, value)) {
                next(value);
                prevValueRef.current = value;
            }
        }, [value, prevValueRef]);
    }
    const tryUpdate = useCallback(
        (newValue) => {
            const value = newValue instanceof Function ? newValue(prevValueRef.current) : newValue;
            if (!isEqual(value, prevValueRef.current)) {
                next(value);
                prevValueRef.current = value;
            }
        },
        [prevValueRef],
    );
    return [current, tryUpdate] as any;
}
