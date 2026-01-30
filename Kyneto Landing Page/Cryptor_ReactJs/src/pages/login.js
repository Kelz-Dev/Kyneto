import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/user.jpg'
import logoIcon from '../assets/images/icon-gradient.png'

export default function Login() {
    return (
        <section className="bg-home d-flex align-items-center position-relative" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'center' }}>
            <div className="bg-overlay bg-gradient-primary opacity-8"></div>
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="form-signin p-4 bg-light rounded shadow-md">
                            <form>
                                <Link to="/index"><img src={logoIcon} className="avatar avatar-md-md mb-4 d-block mx-auto" alt="" /></Link>
                                <h5 className="mb-3">Please sign in</h5>

                                <div className="form-floating mb-2">
                                    <input type="email" className="form-control" id="floatingInput" placeholder="name@example.com" />
                                    <label htmlFor="floatingInput">Email address</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <input type="password" className="form-control" id="floatingPassword" placeholder="Password" />
                                    <label htmlFor="floatingPassword">Password</label>
                                </div>

                                <div className="d-flex justify-content-between">
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                            <label className="form-check-label text-muted" htmlFor="flexCheckDefault">Remember me</label>
                                        </div>
                                    </div>
                                    <small className="forgot-pass text-muted mb-0"><Link to="/reset-password" className="text-muted fw-medium">Forgot password ?</Link></small>
                                </div>

                                <button className="btn btn-primary w-100" type="submit">Sign in</button>

                                <div className="col-12 text-center mt-3">
                                    <small><small className="text-muted me-2">Don't have an account ?</small> <Link to="/signup" className="text-dark fw-medium">Sign Up</Link></small>
                                </div>

                                <p className="mb-0 text-muted mt-3 text-center">© {new Date().getFullYear()} Cryptor.</p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}