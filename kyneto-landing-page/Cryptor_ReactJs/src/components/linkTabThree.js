import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LinkTabThree(){
    let loction = useLocation();
    return(
        <>
        <section className="bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <ul className="list-unstyled sidebar-nav mb-0 text-center" id="navmenu-nav">
                            <li className={`${loction.pathname === '/help-faqs' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/help-faqs" className="navbar-link text-dark">FAQs</Link></li>
                            <li className={`${loction.pathname === '/help-overview' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/help-overview" className="navbar-link text-dark">Overview</Link></li>
                            <li className={`${loction.pathname === '/help-guides' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/help-guides" className="navbar-link text-dark">Guides</Link></li>
                            <li className={`${loction.pathname === '/help-support' ? 'active' : '' } list-inline-item p-4 h6 mb-0 account-menu`}><Link to="/help-support" className="navbar-link text-dark">Support</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}