import React from "react";
import { Link } from "react-router-dom";

import error from '../assets/images/illustration/error.svg'
import { VscRefresh } from '../assets/icons/vander'

export default function Error() {
    return (
        <>
            <section className="bg-home d-flex align-items-center">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-12 text-center">
                            <img src={error} className="img-fluid" style={{ maxWidth: '500px' }} alt="" />
                            <div className="display-6 fw-medium text-capitalize text-dark mb-4">Page Not Found</div>
                            <p className="text-muted para-desc mx-auto">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12 text-center">
                            <Link to="/index" className="btn btn-primary mt-4"><VscRefresh /> Go Back Home</Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}