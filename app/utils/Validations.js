export const validateId = id => {
    const exp = /^[^0 ][1-90]{7,9}$/;
    return exp.test(String(id));
}