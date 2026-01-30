import React from "react";
import { Link } from "react-router-dom";

import { FiSmartphone, FaApple, PiGooglePlayLogo } from '../assets/icons/vander'

export default function FooterTop() {
    return (
        <div className="bg-footer">
            <div className="container-fluid px-0">
                <div className="py-5">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div className="section-title">
                                    <div className="d-flex">
                                        <FiSmartphone className="display-4 text-white title-dark" />
                                        <div className="flex-1 ms-md-4 ms-3">
                                            <h4 className="fw-medium text-light title-dark mb-1">Download our app now !</h4>
                                            <p className="text-white-50 mb-0">Install our Cryptor app and grow your portfolio with Cryptor and earn more n more !</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4 mt-4 mt-sm-0">
                                <div className="text-md-end ms-5 ms-sm-0">
                                    <Link to="#" className="btn btn-primary m-1 d-inline-flex align-items-center"><FaApple className="me-1" /> App Store</Link>
                                    <Link to="#" className="btn btn-soft-primary m-1 d-inline-flex align-items-center"><PiGooglePlayLogo className="me-1" /> Play Store</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}