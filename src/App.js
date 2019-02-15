import React, { useState, useRef } from 'react';
import { ApolloProvider, Mutation, Query } from 'react-apollo';
import client from './client';
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from './graphql';

const StarButton = props => {
  const { node, query, first, last, before, after } = props;
  const totalCount = node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  const starCount = totalCount === 1 ? `${totalCount} Star` : `${totalCount} Stars`;
  const StarStatus = ({ addOrRemoveStar }) => {
    return (
      <button
        onClick={
          () => addOrRemoveStar({
            variables: { input: { starrableId: node.id } },
            update: (store, { data: { addStar, removeStar } }) => { 
              const { starrable } = addStar || removeStar;
              console.log(starrable);
              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables: { query, first, last, after, before }
              });
              const edges = data.search.edges;
              const newEdges = edges.map(edge => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount;
                  // const diff = viewerHasStarred ? -1 : 1;
                  const diff = starrable.viewerHasStarred ? 1 : -1;
                  const newTotalCount = totalCount + diff;
                  edge.node.stargazers.totalCount = newTotalCount; 
                }
                return edge;
              });
              data.search.edges = newEdges;
              store.writeQuery({ query: SEARCH_REPOSITORIES, data })
            },
          })
        }
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    );
  }
  return (
    <Mutation
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />
      }
    </Mutation>
  );
}

const App = props => {
  const PER_PAGE = 5;
  const [query, setQuery] = useState('');
  const [first, setFirst] = useState(PER_PAGE);
  const [after, setAfter] = useState(null);
  const [last, setLast] = useState(null);
  const [before, setBefore] = useState(null);
  const input = useRef();

  const handleSubmit = e => {
    e.preventDefault();
    setQuery(input.current.value);
    setFirst(PER_PAGE);
    setAfter(null);
    setLast(null);
    setBefore(null);
  };

  const goPrevious = search => {
    setFirst(null);
    setAfter(null);
    setLast(PER_PAGE);
    setBefore(search.pageInfo.startCursor);
  }

  const goNext = search => {
    setFirst(PER_PAGE);
    setAfter(search.pageInfo.endCursor);
    setLast(null);
    setBefore(null);
  };

  return (
    <ApolloProvider client={client}>
      <form onSubmit={handleSubmit}>
        <input ref={input} />
        <input type="submit" value="Submit" onSubmit={handleSubmit} />        
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
                          <StarButton
                            node={edge.node}
                            {...{ query, first, last, before, after }} />
                        </li>
                      )
                    })
                  }
                </ul>
                {search.pageInfo.hasPreviousPage && (
                  <button onClick={() => goPrevious(search)}>
                    Previous
                  </button>
                )}
                {search.pageInfo.hasNextPage && (
                  <button onClick={() => goNext(search)}>
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

export default App;
