import React from 'react';
import { FiLayout, FiLock, FiFileText } from '../assets/icons/vander';

export default function RetrieveData() {
    return (
        <section className="section bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 text-center">
                        <div className="section-title mb-4 pb-2">
                            <h4 className="title mb-4">Your Data, Humanly Accessible</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Decentralized storage uses complex cryptographic CIDs, but Kyneto makes it feel like a local drive. Manage your files securely through our integrated portal.</p>
                        </div>
                    </div>
                </div>

                <div className="row mt-4 pt-2">
                    <div className="col-lg-4 col-md-6 mt-4 pt-2">
                        <div className="card features feature-primary explore-feature border-0 rounded text-center p-4">
                            <div className="icon-shape h3 text-primary mb-3">
                                <FiFileText />
                            </div>
                            <div className="content">
                                <h5 className="title">Friendly Filenames</h5>
                                <p className="text-muted mt-3 mb-0">No more memorizing long hashes. Kyneto maps complex CIDs to simple, searchable filenames for instant discovery.</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 col-md-6 mt-4 pt-2">
                        <div className="card features feature-primary explore-feature border-0 rounded text-center p-4">
                            <div className="icon-shape h3 text-primary mb-3">
                                <FiLock />
                            </div>
                            <div className="content">
                                <h5 className="title">Secure Privacy</h5>
                                <p className="text-muted mt-3 mb-0">Access control is baked into your identity. Only you can trigger the reassembly of your data shards from the network.</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 col-md-6 mt-4 pt-2">
                        <div className="card features feature-primary explore-feature border-0 rounded text-center p-4">
                            <div className="icon-shape h3 text-primary mb-3">
                                <FiLayout />
                            </div>
                            <div className="content">
                                <h5 className="title">One-Click Retrieval</h5>
                                <p className="text-muted mt-3 mb-0">Fetch files instantly through our global gateway. The dashboard handles the multi-node retrieval process automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center mt-5">
                    <div className="col-12 text-center">
                        <a href="https://kyneto.app/dashboard/" target="_blank" rel="noreferrer" className="btn btn-primary mt-2">Manage Your Digital Vault</a>
                    </div>
                </div>
            </div>
        </section>
    );
}
