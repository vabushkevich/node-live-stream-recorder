import React from "react";

export default function CreateStreamForm({
  url,
  duration,
  onInputChange,
  onSubmit,
}) {
  return (
    <div className="row mb-3">
      <div className="col-lg-7">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Record new stream</h5>
            <form onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="inputURL">URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="inputURL"
                    name="url"
                    value={url}
                    onChange={onInputChange}
                  />
                </div>
                <div className="form-group col-3 col-md-2">
                  <label htmlFor="inputDuration">Minutes</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    id="inputDuration"
                    name="duration"
                    value={duration}
                    onChange={onInputChange}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Record</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
