import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LinkTabTwo(){
    let loction = useLocation();
    return(
        <section className="bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <ul className="list-unstyled sidebar-nav mb-0 text-center" id="navmenu-nav">
                            <li className={`${loction.pathname === '/career' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/career" className="navbar-link text-dark">All Jobs</Link></li>
                            <li className={`${loction.pathname === '/career-detail' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/career-detail" className="navbar-link text-dark">Job Detail</Link></li>
                            <li className={`${loction.pathname === '/career-apply-form' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/career-apply-form" className="navbar-link text-dark">Job Apply</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}