import React, { Component } from 'react';
import { ApolloProvider } from 'react-apollo';
import { Query } from 'react-apollo';
import client from './client';
import { SEARCH_REPOSITORIES } from './graphql';

const PER_PAGE = 5;
const DEFAULT_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: "フロントエンドエンジニア",
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = DEFAULT_STATE;
  }

  handleChange = e => {
    this.setState({
      query: e.target.value,
    })
  };

  handleSubmit = e => {
    e.preventDefault();
  };

  goNext = search => {
    this.setState({
      // first: PER_PAGE,
      after: search.pageInfo.endCursor,
      // last: null,
      // before: null,
    })
  };

  render() {
    const { query, first, last, before, after } = this.state;
    console.log(query);
    return (
      <ApolloProvider client={client}>
        <form onSubmit={this.handleSubmit}>
          <input
            value={query}
            onChange={this.handleChange}
          />
        </form>
        <Query
          query={SEARCH_REPOSITORIES}
          variables={{ query, first, last, before, after }}
        >
          {
            ({ loading, error, data }) => {
              if (loading) return 'Loading...';
              if (error) return `Error! ${error.message}`;
              console.log({ data });
              const { search } = data;
              const { repositoryCount } = search;
              const repositoryUnit = repositoryCount === 1 ? 'Repository' : 'Repositories'
              const title = `GitHub ${repositoryUnit} Search Result - ${repositoryCount}`
              return (
                <>
                  <h2>{title}</h2>
                  <ul>
                    {
                      search.edges.map(edge => {
                        const { node: {
                          id,
                          url,
                          name,
                        } } = edge;
                        return (
                          <li key={id}>
                            <a href={url} target="_blank" rel="noopener noreferrer">{name}</a>
                          </li>
                        )
                      })
                    }
                  </ul>
                  {console.log(search.pageInfo)}
                  {search.pageInfo.hasNextPage && (
                    <button onClick={() => this.goNext(search)}>
                      Next
                    </button>
                  )}
                </>
              )
            }
          }
        </Query>
      </ApolloProvider>
    );
  }
}

export default App;
