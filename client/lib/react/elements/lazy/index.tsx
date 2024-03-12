import {useEffect, useState } from "react";

export default ({element: _element}) => {
    const [element, setElement] = useState(<></>);
    useEffect(() => {
        new Promise((resolve, reject) => resolve(_element instanceof Function ? _element() : _element)).then((element: any) => {
            setElement(element);
        })
    }, []);
    return <>{element}</>;
}
