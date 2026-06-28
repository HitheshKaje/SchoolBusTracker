class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.totalDocuments = 0;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(searchFields) {
    if (this.queryString.search && searchFields.length > 0) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const orQuery = searchFields.map(field => ({ [field]: searchRegex }));
      this.query = this.query.find({ $or: orQuery });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // Default sorting
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  async countTotal(model, baseQuery = {}) {
    // A simplified way to count documents matching the filter and search criteria
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    let parsedQuery = { ...baseQuery, ...JSON.parse(queryStr) };

    if (this.queryString.search && this.searchFields && this.searchFields.length > 0) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const orQuery = this.searchFields.map(field => ({ [field]: searchRegex }));
      parsedQuery = { ...parsedQuery, $or: orQuery };
    }

    this.totalDocuments = await model.countDocuments(parsedQuery);
    return this;
  }
}

module.exports = ApiFeatures;
