import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {FrontendSharedRoute} from "@shared/route";
import LazyElement from '@lib/react/elements/lazy';

export default ({routes = [] as FrontendSharedRoute[]}) => {
    return (
        <>
            <div>
                {
                    routes.map((route) => <a key={route.key} href={route.path}>{route.key}</a>)
                }
            </div>
            /
            <br />
            /
            <Router>
                <Routes>
                    {
                        routes.map((route) =>
                            <Route key={route.key} path={route.path} element={<LazyElement element={route?.element} />} />
                        )
                    }
                </Routes>
            </Router>
        </>
    );
}
