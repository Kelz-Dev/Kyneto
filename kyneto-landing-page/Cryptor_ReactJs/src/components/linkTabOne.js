import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LinkTabOne(){
    let location = useLocation();
    return(
        <section className="bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <ul className="list-unstyled sidebar-nav mb-0 text-center" id="navmenu-nav">
                            <li className={`${location.pathname === '/aboutus' ? 'active' : ''} list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/aboutus" className="navbar-link text-dark">About us</Link></li>
                            <li className={`${location.pathname === '/career' ? 'active' : ''} list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/career" className="navbar-link text-dark">Career</Link></li>
                            <li className={`${location.pathname === '/mission' ? 'active' : ''} list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/mission" className="navbar-link text-dark">Mission</Link></li>
                            <li className={`${location.pathname === '/features' ? 'active' : ''} list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/features" className="navbar-link text-dark">Features</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}