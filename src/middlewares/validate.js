// Express 5 membuat req.query read-only, jadi hasil parse disimpan di req.valid
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {
    body: schemas.body?.parse(req.body),
    query: schemas.query?.parse(req.query),
    params: schemas.params?.parse(req.params),
  };
  next();
};
