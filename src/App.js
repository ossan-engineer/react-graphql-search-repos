import React, { Component, useState } from 'react';
import { ApolloProvider, Mutation, Query } from 'react-apollo';
import client from './client';
import { ADD_STAR, SEARCH_REPOSITORIES } from './graphql';

const StarButton = props => {
  const { node } = props;
  const totalCount = node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  console.log({ viewerHasStarred });
  const starCount = totalCount === 1 ? `${totalCount} Star` : `${totalCount} Stars`;
  const StarStatus = ({ addStar }) => {
    return (
      <button
        onClick={
          () => addStar({
            variables: { input: { starrableId: node.id } }
          })
        }
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    );
  }
  return (
    <Mutation mutation={ADD_STAR}>
      {
        addStar => <StarStatus addStar={addStar} />
      }
    </Mutation>
  );
}

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

  goPrevious = search => {
    this.setState({
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor,
    })
  }

  goNext = search => {
    this.setState({
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null,
    })
  };

  render() {
    const { query, first, last, before, after } = this.state;
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
                            &nbsp;
                            <StarButton node={edge.node} />
                          </li>
                        )
                      })
                    }
                  </ul>
                  {search.pageInfo.hasPreviousPage && (
                    <button onClick={() => this.goPrevious(search)}>
                      Previous
                    </button>
                  )}
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
