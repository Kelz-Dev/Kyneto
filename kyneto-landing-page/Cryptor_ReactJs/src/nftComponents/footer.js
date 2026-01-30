import React from "react";
import { Link } from "react-router-dom";

import logoLight from '../assets/images/logo-light.png'

export default function Footer(){
    return(
        <footer className="bg-footer">    
            <div className="footer-py-30 footer-bar bg-footer">
                <div className="container text-center">
                    <div className="row align-items-center justify-content-between">
                        <div className="col-lg-3 col-md-2 col-sm-3">
                            <div className="text-sm-start">
                                <Link to="#" className="logo-footer">
                                    <img src={logoLight} height="28" alt=""/>
                                </Link>
                            </div>
                        </div>
    
                        <div className="col-lg-6 col-md-6 col-sm-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <ul className="list-unstyled footer-list terms-service mb-0">
                                <li className="list-inline-item mb-0"><Link to="/nft-explore" className="text-foot me-2">Explore</Link></li>
                                <li className="list-inline-item mb-0"><Link to="/nft-faqs" className="text-foot me-2">FAQs</Link></li>
                                <li className="list-inline-item mb-0"><Link to="#" className="text-foot me-2">Terms</Link></li>
                                <li className="list-inline-item mb-0"><Link to="#" className="text-foot">Privacy</Link></li>
                            </ul>
                        </div>

                        <div className="col-lg-3 col-md-4 col-sm-3 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="text-sm-end">
                                <p className="mb-0 text-foot">© {new Date().getFullYear()} <Link to="http://www.shreethemes.in/" target="_blank" className="text-reset">Shreethemes</Link>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}